import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MessageIcon from '@mui/icons-material/Message';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarIcon from '@mui/icons-material/Star';
import TableChartIcon from '@mui/icons-material/TableChart';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleTryNow = () => {
    navigate('/home');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar position="static" color="transparent" elevation={0} style={{ borderBottom: '1px solid #e0e0e0', background: 'white' }}>
        <Toolbar style={{ padding: '0 16px', height: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Typography variant="h5" component="div" style={{ fontWeight: 'bold', color: '#32CD32' }}>
              Event
            </Typography>
            <Typography variant="h5" component="div" style={{ fontWeight: 'bold' }}>
              Judge
            </Typography>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '24px' }}>
            <a href="#problems" style={{ textDecoration: 'none', fontSize: '0.875rem', fontWeight: '500', color: 'inherit' }}>
              Проблемы
            </a>
            <a href="#solution" style={{ textDecoration: 'none', fontSize: '0.875rem', fontWeight: '500', color: 'inherit' }}>
              Решение
            </a>
            <a href="#features" style={{ textDecoration: 'none', fontSize: '0.875rem', fontWeight: '500', color: 'inherit' }}>
              Возможности
            </a>
            <a href="#results" style={{ textDecoration: 'none', fontSize: '0.875rem', fontWeight: '500', color: 'inherit' }}>
              Результаты
            </a>
            <a href="#partners" style={{ textDecoration: 'none', fontSize: '0.875rem', fontWeight: '500', color: 'inherit' }}>
              Партнеры
            </a>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleTryNow}
            >
              Попробовать бесплатно
            </Button>
          </div>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box sx={{
        background: 'linear-gradient(to right, #2563eb, #4f46e5)',
        py: 8,
        color: 'white'
      }}>
        <Container>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Будущее соревнований начинается здесь
                </Typography>
                <Typography variant="h6" sx={{ mb: 4, color: '#bfdbfe' }}>
                  Универсальная платформа для организации, судейства и управления любыми соревнованиями —от дебатов до хакатон.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleTryNow}
                  sx={{
                    background: 'white',
                    color: '#2563eb',
                    '&:hover': {
                      background: '#f8fafc',
                    }
                  }}
                >
                  Попробовать бесплатно
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    color: 'white',
                    borderColor: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      background: 'rgba(255, 255, 255, 0.1)',
                    }
                  }}
                >
                  Подробнее
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  height: 400,
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 2,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img 
                  src="/images/image1.png" 
                  alt="Платформа EventJudge"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Problems Section */}
      <Box id="problems" sx={{ py: 8, bgcolor: 'white' }}>
        <Container>
          <Typography variant="h4" component="h2" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            Проблема: Неэффективность организации соревнований и мероприятий
          </Typography>
          <Typography variant="body1" align="center" sx={{ mb: 6, maxWidth: '900px', mx: 'auto' }}>
            С каждым годом в Казахстане и по всему миру проходит все больше интеллектуальных, образовательных и
            проектных соревнований — дебаты, кейсы, хакатоны, стартап-выставки, олимпиады и т.д. Несмотря на рост
            масштабов и важности этих мероприятий, инфраструктура их организации и судейства остается на уровне
            прошлого.
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ bgcolor: '#e6f7ff', p: 1, borderRadius: '50%' }}>
                      <TableChartIcon sx={{ color: '#2563eb' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Google Forms и Excel
                    </Typography>
                  </Box>
                  <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                    <li>Регистрация участников через формы, экспорт в таблицах</li>
                    <li>Ручное распределение по потокам</li>
                    <li>Ошибки, потери данных, дублирование и сложность</li>
                  </ul>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ bgcolor: '#e6f7ff', p: 1, borderRadius: '50%' }}>
                      <MessageIcon sx={{ color: '#2563eb' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Чаты в мессенджерах
                    </Typography>
                  </Box>
                  <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                    <li>Судьи получают сообщения с расписанием вручную</li>
                    <li>Объявления теряются, участники не видят важные уведомления</li>
                    <li>Нет централизованной коммуникации</li>
                  </ul>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ bgcolor: '#e6f7ff', p: 1, borderRadius: '50%' }}>
                      <AccessTimeIcon sx={{ color: '#2563eb' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Таймеры через сайты
                    </Typography>
                  </Box>
                  <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                    <li>Нет синхронизации</li>
                    <li>Судьи не понимают, сколько времени осталось</li>
                    <li>Участники превышают лимиты, нет контроля</li>
                  </ul>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ bgcolor: '#e6f7ff', p: 1, borderRadius: '50%' }}>
                      <WarningAmberIcon sx={{ color: '#2563eb' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Обратная связь
                    </Typography>
                  </Box>
                  <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                    <li>Нестр устная, без деталей</li>
                    <li>Неструктурированная, субъективная</li>
                    <li>Отсутствует механизм для анализа, обучения</li>
                  </ul>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 6, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              Всё ещё Excel, ручки и голосовые чаты?
            </Typography>
            <Typography variant="body1">
              Организация соревнований всё ещё страдает от устаревших процессов.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Solution Section */}
      <Box id="solution" sx={{ py: 8, bgcolor: '#f8fafc' }}>
        <Container>
          <Typography variant="h4" component="h2" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            Наше решение: Единая платформа для соревнований, судейства и обратной связи
          </Typography>
          <Typography variant="body1" align="center" sx={{ mb: 6, maxWidth: '900px', mx: 'auto' }}>
            Мы разработали инновационную веб-платформу, которая автоматизирует и улучшает каждый этап организации
            интеллектуальных соревнований и мероприятий — от регистрации до финальной обратной связи.
          </Typography>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                Ключевые возможности платформы:
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ bgcolor: '#e6f7ff', p: 1, borderRadius: '50%', mt: 0.5 }}>
                    <CheckCircleOutlineIcon sx={{ color: '#2563eb' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                      Единая регистрация участников и команд
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Централизованная система регистрации с автоматической валидацией данных
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ bgcolor: '#e6f7ff', p: 1, borderRadius: '50%', mt: 0.5 }}>
                    <CheckCircleOutlineIcon sx={{ color: '#2563eb' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                      Панель участника
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Персональный доступ к расписанию, результатам и уведомлениям
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ bgcolor: '#e6f7ff', p: 1, borderRadius: '50%', mt: 0.5 }}>
                    <CheckCircleOutlineIcon sx={{ color: '#2563eb' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                      Автоматическая табуляция
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Мгновенный подсчет результатов и формирование рейтингов
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ bgcolor: '#e6f7ff', p: 1, borderRadius: '50%', mt: 0.5 }}>
                    <CheckCircleOutlineIcon sx={{ color: '#2563eb' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                      Обратная связь участникам
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Структурированная система отзывов и рекомендаций
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  height: 400,
                  bgcolor: '#e2e8f0',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="h5">EventJudge Platform Features</Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Results Section */}
      <Box id="results" sx={{ py: 8, background: 'linear-gradient(to right, #2563eb, #4f46e5)', color: 'white' }}>
        <Container>
          <Typography variant="h4" component="h2" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 6 }}>
            Результаты от Qamqor Cup I (Turan University):
          </Typography>

          <Grid container spacing={4} textAlign="center">
            <Grid item xs={12} md={4}>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>6-8 часов</Typography>
              <Typography variant="h6">сэкономлено на мероприятие</Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>100%</Typography>
              <Typography variant="h6">судей использовали платформу</Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>500+</Typography>
              <Typography variant="h6">отзывов автоматически отправлено</Typography>
            </Grid>
          </Grid>

          <Box sx={{ mt: 6, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>0 Excel файлов</Typography>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box id="features" sx={{ py: 8, bgcolor: 'white' }}>
        <Container>
          <Typography variant="h4" component="h2" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 6 }}>
            Будущие разработки
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ bgcolor: '#e6f7ff', p: 1, borderRadius: '50%' }}>
                      <StarIcon sx={{ color: '#2563eb' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Cross-platform
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    Android и iOS приложения для мобильного доступа
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 8, bgcolor: '#f8fafc' }}>
        <Container maxWidth="md">
          <Box
            sx={{
              textAlign: 'center',
              p: 6,
              borderRadius: 2,
              bgcolor: 'white',
              boxShadow: 3,
            }}
          >
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
              Готовы попробовать?
            </Typography>
            <Typography variant="body1" sx={{ mb: 4 }}>
              Присоединяйтесь к нам и сделайте организацию вашего мероприятия проще и эффективнее.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleTryNow}
            >
              Попробовать бесплатно
            </Button>
          </Box>
        </Container>
      </Box>
    </div>
  );
};

export default LandingPage; 