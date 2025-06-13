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
  Divider
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';

interface ProductCardProps {
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  stock: number;
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

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'error' as const };
    if (stock < 10) return { label: 'Low Stock', color: 'warning' as const };
    return { label: 'In Stock', color: 'success' as const };
  };

  const stockStatus = getStockStatus(stock);

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
          transition: 'transform 0.3s, box-shadow 0.3s',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          boxShadow: isHovered ? '0 8px 16px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleOpenDialog}
      >
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
        <CardContent>
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