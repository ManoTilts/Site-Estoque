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
  Box
} from '@mui/material';

interface ProductCardProps {
  title: string;
  description: string;
  imageUrl: string;
  price?: string;
  onAddToCart: () => void;
  fullDescription?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  title, 
  description, 
  imageUrl, 
  price, 
  onAddToCart,
  fullDescription 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <Card 
        sx={{ 
          width: 250, 
          height: 300,
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
        <CardMedia component="img" height="140" image={imageUrl} alt={title} />
        <CardContent>
          <Typography variant="h5" component="div">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
          {price && (
            <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
              {price}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <CardMedia 
              component="img" 
              sx={{ 
                width: { xs: '100%', sm: 200 },
                height: { xs: 200, sm: 'auto' },
                objectFit: 'cover'
              }} 
              image={imageUrl} 
              alt={title} 
            />
            <Box>
              <Typography variant="body1" paragraph>
                {fullDescription || description}
              </Typography>
              {price && (
                <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                  {price}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          <Button onClick={onAddToCart} variant="contained" color="primary">
            Add to Cart
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProductCard;