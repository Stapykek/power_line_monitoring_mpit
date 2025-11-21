import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';

export default function Header() {
    return (
        <Container maxWidth="sm" sx={{ textAlign: 'center', my: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom>
                Анализ состояния ЛЭП
            </Typography>
            <Typography variant="h6" color="text.secondary">
                Автоматический осмотр виброгасителей, изоляторов и траверсов
            </Typography>
        </Container>
    );
}