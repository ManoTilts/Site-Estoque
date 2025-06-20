import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  CardMedia, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Box,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';

interface ProductCardProps {
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  stock: number;
  low_stock_threshold?: number;
  category?: string;
  distributer: string;
  unit?: string;
  onManageItem: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  title, 
  description, 
  imageUrl, 
  price,
  stock,
  low_stock_threshold = 10,
  category,
  distributer,
  unit,
  onManageItem,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [dialogImageError, setDialogImageError] = useState(false);

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleDialogImageError = () => {
    setDialogImageError(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getStockStatus = (stock: number, threshold: number) => {
    if (stock === 0) return { 
      label: 'Out of Stock', 
      color: 'error' as const, 
      icon: <ErrorIcon sx={{ fontSize: 16 }} />,
      severity: 'critical' as const
    };
    if (stock <= threshold) return { 
      label: 'Low Stock', 
      color: 'warning' as const, 
      icon: <WarningIcon sx={{ fontSize: 16 }} />,
      severity: 'warning' as const
    };
    return { 
      label: 'In Stock', 
      color: 'success' as const, 
      icon: null,
      severity: 'normal' as const
    };
  };

  const stockStatus = getStockStatus(stock, low_stock_threshold);
  
  // Check if item needs alert
  const isLowStock = stock <= low_stock_threshold && stock > 0;
  const isOutOfStock = stock === 0;

  // Fallback image component
  const ImageFallback = ({ height }: { height: number | string }) => (
    <Box
      sx={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'grey.200',
        color: 'grey.500'
      }}
    >
      <ImageIcon sx={{ fontSize: 48 }} />
    </Box>
  );

  return (
    <>
      <Card 
        sx={{ 
          width: 500, 
          height: 350,
          cursor: 'pointer',
          transition: 'transform 0.3s, box-shadow 0.3s, border-color 0.3s',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          boxShadow: isHovered ? '0 8px 16px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)',
          border: isOutOfStock ? '3px solid #d32f2f' : isLowStock ? '2px solid #ff9800' : '1px solid #e0e0e0',
          position: 'relative',
          '&:hover': {
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleOpenDialog}
      >
        {/* Ícone de alerta posicionado absolutamente */}
        {(isOutOfStock || isLowStock) && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 10,
              backgroundColor: isOutOfStock ? 'error.main' : 'warning.main',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            {isOutOfStock ? (
              <ErrorIcon sx={{ color: 'white', fontSize: 20 }} />
            ) : (
              <WarningIcon sx={{ color: 'white', fontSize: 20 }} />
            )}
          </Box>
        )}
        {imageError || !imageUrl ? (
          <ImageFallback height={140} />
        ) : (
          <CardMedia 
            component="img" 
            height="140" 
            image={imageUrl} 
            alt={title}
            onError={handleImageError}
          />
        )}
        <CardContent sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%',
          justifyContent: 'space-between'
        }}>
          <Box>
            <Typography variant="h6" component="div" noWrap>
              {title}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                wordWrap: 'break-word',
                hyphens: 'auto'
              }}
            >
              {description}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6" color="primary">
                {formatPrice(price)}
              </Typography>
              <Chip 
                label={stockStatus.label} 
                color={stockStatus.color} 
                size="small"
                {...(stockStatus.icon && { icon: stockStatus.icon })}
                sx={{
                  fontWeight: stockStatus.severity !== 'normal' ? 'bold' : 'normal',
                  '& .MuiChip-icon': {
                    fontSize: 16
                  }
                }}
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              Stock: {stock}
            </Typography>
            
            {category && (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                Category: {category}
              </Typography>
            )}
          </Box>
          
          {/* Alerta visual para estoque baixo - sempre no final */}
          {(isLowStock || isOutOfStock) && (
            <Alert 
              severity={isOutOfStock ? "error" : "warning"} 
              icon={stockStatus.icon}
              sx={{ 
                mt: 1,
                py: 0.25,
                px: 1,
                '& .MuiAlert-message': {
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  lineHeight: 1.1
                },
                '& .MuiAlert-icon': {
                  fontSize: '0.9rem'
                }
              }}
            >
              {isOutOfStock ? 'OUT OF STOCK' : `LOW STOCK (≤${low_stock_threshold})`}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            {dialogImageError || !imageUrl ? (
              <Box sx={{ 
                width: { xs: '100%', sm: 200 },
                height: { xs: 200, sm: 200 },
              }}>
                <ImageFallback height="100%" />
              </Box>
            ) : (
              <CardMedia 
                component="img" 
                sx={{ 
                  width: { xs: '100%', sm: 200 },
                  height: { xs: 200, sm: 'auto' },
                  objectFit: 'cover'
                }} 
                image={imageUrl} 
                alt={title}
                onError={handleDialogImageError}
              />
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" paragraph>
                {description}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
                <Typography variant="subtitle2">Price:</Typography>
                <Typography variant="body2">{formatPrice(price)}</Typography>
                
                <Typography variant="subtitle2">Stock:</Typography>
                <Typography variant="body2">{stock}</Typography>
                
                <Typography variant="subtitle2">Distributor:</Typography>
                <Typography variant="body2">{distributer}</Typography>
                
                {category && (
                  <>
                    <Typography variant="subtitle2">Category:</Typography>
                    <Typography variant="body2">{category}</Typography>
                  </>
                )}
                
                {unit && (
                  <>
                    <Typography variant="subtitle2">Unit:</Typography>
                    <Typography variant="body2">{unit}</Typography>
                  </>
                )}
              </Box>
              
              <Chip 
                label={stockStatus.label} 
                color={stockStatus.color} 
                size="small"
                {...(stockStatus.icon && { icon: stockStatus.icon })}
                sx={{
                  fontWeight: stockStatus.severity !== 'normal' ? 'bold' : 'normal',
                  '& .MuiChip-icon': {
                    fontSize: 16
                  }
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          <Button onClick={onManageItem} variant="contained" color="primary">
            Manage Item
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProductCard;