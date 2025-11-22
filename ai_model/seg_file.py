import os
import json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
from ultralytics import YOLO
from segment_anything import sam_model_registry, SamPredictor


def process_and_segment(
        images_dir,
        masks_dir,
        output_json_path,
        model_path,
        sam_checkpoint="sam_vit_b_01ec64.pth",
        target_classes={5, 6},
        conf_threshold=0.25,
        device="cpu"  # или "cuda"
):
    """
    Полный пайплайн: детекция + сегментация для целевых классов (5, 6).

    Параметры:
        images_dir (str): Папка с изображениями
        masks_dir (str): Папка для сохранения масок
        output_json_path (str): Путь к выходному JSON
        model_path (str): Путь к YOLO .pt файлу
        sam_checkpoint (str): Путь к весам SAM
        target_classes (set): Классы, для которых делать сегментацию
        conf_threshold (float): Порог уверенности YOLO
        device (str): "cpu" или "cuda"
    """
    # === Подготовка ===
    images_path = Path(images_dir)
    masks_path = Path(masks_dir)
    masks_path.mkdir(parents=True, exist_ok=True)

    # Поддерживаемые расширения
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp'}
    image_files = [f for f in images_path.iterdir() if f.suffix.lower() in image_extensions]
    image_files.sort()

    # === Загрузка моделей ===
    print("🔁 Загружаем YOLO...")
    yolo_model = YOLO(model_path)

    print("🔁 Загружаем SAM...")
    sam = sam_model_registry["vit_b"](checkpoint=sam_checkpoint)
    sam.to(device=device)
    sam_predictor = SamPredictor(sam)

    # === Этап 1: Детекция и формирование JSON ===
    coco_output = {"images": [], "annotations": []}
    annotation_id = 0

    # Словарь для хранения bbox'ов целевых классов по image_id (для сегментации)
    seg_tasks = {}  # {image_id: [{"bbox": [...], "category_id": ...}, ...]}

    for img_id, img_path in enumerate(image_files, start=0):
        with Image.open(img_path) as img:
            width, height = img.size

        mask_name = f"{img_path.stem}_mask.png"

        coco_output["images"].append({
            "id": img_id,
            "file_name": img_path.name,
            "mask_name": mask_name,
            "width": width,
            "height": height
        })

        # YOLO инференс
        results = yolo_model(str(img_path), conf=conf_threshold)
        result = results[0]

        current_seg_boxes = []

        if result.boxes is not None and len(result.boxes) > 0:
            boxes_xyxy = result.boxes.xyxy.cpu().numpy()
            classes = result.boxes.cls.cpu().numpy()
            confidences = result.boxes.conf.cpu().numpy()

            for box, cls, conf in zip(boxes_xyxy, classes, confidences):
                x1, y1, x2, y2 = box
                w, h = x2 - x1, y2 - y1
                bbox_coco = [round(x1), round(y1), round(w), round(h)]

                # Добавляем аннотацию в JSON
                coco_output["annotations"].append({
                    "id": annotation_id,
                    "image_id": img_id,
                    "category_id": int(cls),
                    "bbox": bbox_coco,
                    "score": float(conf)
                })

                # Если класс целевой — запоминаем для сегментации
                if int(cls) in target_classes:
                    current_seg_boxes.append({
                        "bbox": bbox_coco,
                        "category_id": int(cls)
                    })

                annotation_id += 1

        # Сохраняем задачи сегментации для этого изображения
        if current_seg_boxes:
            seg_tasks[img_id] = current_seg_boxes

    # Сохраняем JSON
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(coco_output, f, indent=2, ensure_ascii=False)

    print(f"✅ Детекция завершена. JSON сохранён: {output_json_path}")
    print(f"📦 Всего аннотаций: {len(coco_output['annotations'])}")
    print(f"🔍 Изображений для сегментации (классы {sorted(target_classes)}): {len(seg_tasks)}")

    # === Этап 2: Сегментация масок с помощью SAM ===
    images_by_id = {img["id"]: img for img in coco_output["images"]}

    for img_id, boxes_list in seg_tasks.items():
        img_info = images_by_id[img_id]
        image_path = images_path / img_info["file_name"]
        mask_path = masks_path / img_info["mask_name"]

        # Загружаем изображение
        image = cv2.imread(str(image_path))
        if image is None:
            print(f"⚠️ Не удалось загрузить {image_path}")
            continue
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Устанавливаем в SAM
        sam_predictor.set_image(image_rgb)

        H, W = image_rgb.shape[:2]
        combined_mask = np.zeros((H, W), dtype=np.uint8)

        for box_data in boxes_list:
            x, y, w, h = box_data["bbox"]
            x_min, y_min = int(x), int(y)
            x_max, y_max = int(x + w), int(y + h)
            input_box = np.array([x_min, y_min, x_max, y_max])

            try:
                masks, _, _ = sam_predictor.predict(box=input_box, multimask_output=False)
                mask = masks[0]
                combined_mask = np.logical_or(combined_mask, mask)
            except Exception as e:
                print(f"❌ Ошибка сегментации на {img_info['file_name']}, bbox {input_box}: {e}")
                continue

        # Сохраняем маску (0/255)
        mask_to_save = (combined_mask * 255).astype(np.uint8)
        cv2.imwrite(str(mask_path), mask_to_save)
        print(f"✅ Маска сохранена: {mask_path.name}")

    print(f"\n🎉 Всё завершено! Маски сохранены в: {masks_dir}")


process_and_segment(
    images_dir="../data/images",
    masks_dir="../data/masks",
    output_json_path="../data/detections_and_masks.json",
    model_path="../complete/best.pt",
    sam_checkpoint="sam_vit_b_01ec64.pth",
    target_classes={5, 6},
    conf_threshold=0.3,
    device="cpu"  # или "cuda" если есть GPU
)