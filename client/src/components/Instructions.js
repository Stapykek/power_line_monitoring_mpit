import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

export default function Instructions() {
    return (
        <Container maxWidth="sm" sx={{ my: 4 }}>
            <Typography variant="h5" gutterBottom>
                Инструкция по использованию
            </Typography>
            <List>
                <ListItem>
                     <ListItemText primary="1. Перетащите ZIP-архив или изображения (JPG/PNG/TIFF) в зону загрузки." />
                </ListItem>
                <ListItem sx={{ pl: 4 }}>
                    <ListItemText primary="— Поддерживаются папки до 10 ГБ." />
                </ListItem>
                <ListItem sx={{ pl: 4 }}>
                    <ListItemText primary="— Рекомендуется загружать снимки с дрона в исходном разрешении." />
                </ListItem>
                <ListItem>
                    <ListItemText primary="2. Нажмите «Начать анализ»." />
                </ListItem>
                <ListItem sx={{ pl: 4 }}>
                    <ListItemText primary="— Система автоматически обработает все изображения." />
                </ListItem>
                <ListItem>
                    <ListItemText primary="3. Просмотрите результаты:" />
                </ListItem>
                <ListItem sx={{ pl: 4 }}>
                    <ListItemText primary="— Галерея: сверху вы можете выбрать фильтры. Кликните на изображение, чтобы увидеть детали." />
                </ListItem>
                <ListItem sx={{ pl: 4 }}>
                    <ListItemText primary="— Справа: топ-3 класса с уверенностью и признаки дефектов (трещина, перекос и т.д.), режим сегментации и выбор уровня критичности" />
                </ListItem>
                <ListItem sx={{ pl: 4 }}>
                    <ListItemText primary="— Также вы можете посмотреть статистику по всему пакету." />
                </ListItem>
                <ListItem>
                    <ListItemText primary="4. Сохраните сессию:" />
                </ListItem>
                <ListItem sx={{ pl: 4 }}>
                    <ListItemText primary="— Нажмите «Сохранить сессию», чтобы экспортировать отчёт и вернуться к результатам позже." />
                </ListItem>
            </List>
        </Container>
    );
}