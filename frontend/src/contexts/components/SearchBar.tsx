import React, { useState } from 'react';
import { 
  TextField, 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Fab, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button,
  SelectChangeEvent,
  IconButton,
  InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

export interface CardFormData {
  title: string;
  description: string;
  imageUrl: string;
  price?: string;
}

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
  onSort: (sortBy: string) => void;
  onAddCard: (cardData: CardFormData) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onSort, onAddCard }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('title');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CardFormData>({
    title: '',
    description: '',
    imageUrl: '',
    price: ''
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch(value);
  };

  const handleSortChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setSortOption(value);
    onSort(value);
  };

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    // Reset form
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      price: ''
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    onAddCard(formData);
    handleCloseDialog();
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, mt: 2 }}>
      {/* Search Field */}
      <TextField
        sx={{ flexGrow: 1 }}
        variant="outlined"
        label="Search Products"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <IconButton onClick={clearSearch} edge="end" size="small">
                <CloseIcon />
              </IconButton>
            </InputAdornment>
          )
        }}
      />

      {/* Sort Dropdown */}
      <FormControl sx={{ minWidth: 150 }}>
        <InputLabel>Sort By</InputLabel>
        <Select
          value={sortOption}
          label="Sort By"
          onChange={handleSortChange}
        >
          <MenuItem value="title-asc">Title A-Z</MenuItem>
          <MenuItem value="title-desc">Title Z-A</MenuItem>
          <MenuItem value="price-asc">Price: Low to High</MenuItem>
          <MenuItem value="price-desc">Price: High to Low</MenuItem>
        </Select>
      </FormControl>

      {/* Add Button */}
      <Fab 
        color="primary" 
        aria-label="add" 
        onClick={handleOpenDialog}
        sx={{ 
          boxShadow: 3,
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.1)'
          }
        }}
      >
        <AddIcon />
      </Fab>

      {/* Add Card Dialog */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add New Product
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleFormChange}
              variant="outlined"
              required
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              variant="outlined"
              multiline
              rows={3}
              required
            />
            <TextField
              fullWidth
              label="Image URL"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleFormChange}
              variant="outlined"
              required
            />
            <TextField
              fullWidth
              label="Price"
              name="price"
              value={formData.price}
              onChange={handleFormChange}
              variant="outlined"
              placeholder="e.g. $19.99"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={!formData.title || !formData.description || !formData.imageUrl}
          >
            Add Product
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SearchBar;