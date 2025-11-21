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
                    <ListItemText primary="1. Перетащите файлы в зону загрузки или нажмите 'Выбрать файл'" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="2. Подождите, пока система обработает изображения" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="3. После анализа вы увидите результаты в виде галереи с детализированными метками" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="4. Для просмотра деталей нажмите на любую картинку" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="5. В правой панели отобразится статистика по всем обнаруженным дефектам" />
                </ListItem>
            </List>
        </Container>
    );
}