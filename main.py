import streamlit as st

def main_page_header(container: st.container) -> None:
    clear_container(container)
    with container.container():
        st.html('''<style>
        [data-testid="stMarkdown"]{
        width:80%;
        margin:auto
        }</style>
        ''')
        st.markdown('''
        # {Название} — Автоматический анализ состояния ЛЭП по фото с дрона
        ### Загрузите изображения — ИИ найдёт дефекты в виброгасителях, изоляторах и траверсах
        ''')

def drag_and_drop(container: st.container) -> None:
    with container.container():
        st.file_uploader(label="Загрузка изображений", label_visibility='hidden', accept_multiple_files=True, type=["png", "jpg", "jpeg", "tiff", "RAW", "zip"])
        st.markdown('''
                <style>
                
                [data-testid="stFileUploaderDropzone"]{
                width: 70%;
                height: 15%;
                display: block;
                margin: auto;
                }
                [data-testid='stWidgetLabel']{
                display: none;
                }
                [data-testid='stFileUploaderDropzoneInstructions'] > div > span {
                display: none;
                }
                [data-testid='stFileUploaderDropzoneInstructions'] > div::before {
                content: "Загрузите файлы в одном из форматов: .png, .jpg., .tiff., .RAW, .zip";
                }
                [data-testid='stBaseButton-secondary']{
                background-color: #FFFFFF;
                text-indent: -9999px;
                line-height: 0;
                }
                [data-testid='stBaseButton-secondary']::after{
                line-height: initial;
                content: "Загрузить...";
                text-indent: 0;
                }
                </style>
                ''', unsafe_allow_html=True)

def instructions(container: st.container) -> None:
    with container.container():
        '''
        ## Как пользоваться сервисом?
        1. Перетащите или загрузите изображения в окно,
        2. Нажмите кнопку: "Начать детекцию",
        3. Дождитесь обработки изображений,
        4. Нажмите на изображение для получения подробной информации.
        '''


def clear_container(container: st.container) -> None:
    container.empty()

if __name__ == "__main__":
    st.set_page_config(layout="wide")
    header_container = st.empty()
    main_page_header(header_container)
    drag_and_drop_cont = st.empty()
    drag_and_drop(drag_and_drop_cont)
    instructions_container = st.empty()
    instructions(instructions_container)


