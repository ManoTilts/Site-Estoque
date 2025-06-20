import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  IconButton,
  Paper,
  Snackbar,
  Card,
  CardContent,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import {
  Close as CloseIcon,
  CameraAlt as CameraIcon,
  QrCodeScanner as QrCodeScannerIcon,
  Refresh as RefreshIcon,
  Stop as StopIcon
} from '@mui/icons-material';
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeCameraScanConfig } from 'html5-qrcode';

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
  title?: string;
}

export default function QRScanner({ open, onClose, onScan, title = "Escanear QR Code" }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState('');
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerElementId = 'qr-reader';

  // Initialize cameras list
  useEffect(() => {
    if (open) {
      initializeCameras();
    }
    return () => {
      cleanup();
    };
  }, [open]);

  const initializeCameras = async () => {
    try {
      // Request camera permission first
      await navigator.mediaDevices.getUserMedia({ video: true });
      setPermissionGranted(true);
      
      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices.map(device => ({ id: device.id, label: device.label || `Camera ${device.id}` })));
        setSelectedCamera(devices[0].id);
      } else {
        setError('Nenhuma câmera encontrada no dispositivo.');
      }
    } catch (err) {
      console.error('Error accessing cameras:', err);
      setPermissionGranted(false);
      setError('Permissão de câmera negada ou erro ao acessar câmeras.');
    }
  };

  const startScanning = async (cameraId: string) => {
    if (!cameraId) return;

    try {
      setScanning(true);
      setError(null);

      // Initialize Html5Qrcode
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerElementId);
      }

      // Configure scanner
      const config: Html5QrcodeCameraScanConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      // Start scanning
      await html5QrCodeRef.current.start(
        cameraId,
        config,
        (decodedText: string) => {
          console.log('QR Code detected:', decodedText);
          
          // Show success message
          setSuccessMessage('QR Code escaneado com sucesso!');
          
          // Call the callback with scanned data
          onScan(decodedText);
          
          // Stop scanning and close after successful scan
          stopScanning();
          setTimeout(() => {
            handleClose();
          }, 1000);
        },
        (errorMessage: string) => {
          // This is called when no QR code is found - it's normal and frequent
          // Only log if it's a real error, not just "No QR code found"
          if (!errorMessage.includes('No MultiFormat Readers') && 
              !errorMessage.includes('NotFoundException')) {
            console.debug('QR scan error:', errorMessage);
          }
        }
      );

    } catch (err: any) {
      console.error('Error starting scanner:', err);
      setError(`Erro ao iniciar scanner: ${err.message || 'Erro desconhecido'}`);
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    try {
      if (html5QrCodeRef.current && 
          html5QrCodeRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
        await html5QrCodeRef.current.stop();
      }
    } catch (err) {
      console.error('Error stopping scanner:', err);
    } finally {
      setScanning(false);
    }
  };

  const cleanup = async () => {
    await stopScanning();
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.getState() !== Html5QrcodeScannerState.NOT_STARTED) {
          await html5QrCodeRef.current.clear();
        }
      } catch (err) {
        console.error('Error clearing scanner:', err);
      }
      html5QrCodeRef.current = null;
    }
    setError(null);
    setSuccessMessage('');
    setScanning(false);
  };

  const handleClose = async () => {
    await cleanup();
    onClose();
  };

  const handleCameraChange = async (event: SelectChangeEvent) => {
    const newCameraId = event.target.value;
    setSelectedCamera(newCameraId);
    
    if (scanning) {
      await stopScanning();
    }
    
    if (newCameraId) {
      await startScanning(newCameraId);
    }
  };

  const handleStartScanning = () => {
    if (selectedCamera && !scanning) {
      startScanning(selectedCamera);
    }
  };

  const handleStopScanning = () => {
    if (scanning) {
      stopScanning();
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            minHeight: '600px'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <QrCodeScannerIcon color="primary" />
              <Typography variant="h6">{title}</Typography>
            </Box>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {permissionGranted === false && (
            <Card sx={{ mb: 2 }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <CameraIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Permissão de Câmera Necessária
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Para escanear QR Codes, precisamos acessar sua câmera.
                  Por favor, habilite a permissão de câmera no seu navegador.
                </Typography>
                <Button
                  variant="contained"
                  onClick={initializeCameras}
                  startIcon={<CameraIcon />}
                >
                  Tentar Novamente
                </Button>
              </CardContent>
            </Card>
          )}

          {permissionGranted === true && cameras.length > 0 && (
            <>
              {/* Camera Selection */}
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Selecionar Câmera</InputLabel>
                  <Select
                    value={selectedCamera}
                    label="Selecionar Câmera"
                    onChange={handleCameraChange}
                  >
                    {cameras.map((camera) => (
                      <MenuItem key={camera.id} value={camera.id}>
                        {camera.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Scanner Controls */}
              <Box sx={{ mb: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
                {!scanning ? (
                  <Button
                    variant="contained"
                    startIcon={<QrCodeScannerIcon />}
                    onClick={handleStartScanning}
                    disabled={!selectedCamera}
                  >
                    Iniciar Scanner
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={<StopIcon />}
                    onClick={handleStopScanning}
                    color="error"
                  >
                    Parar Scanner
                  </Button>
                )}
                
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={initializeCameras}
                >
                  Atualizar
                </Button>
              </Box>

              {/* Scanner Container */}
              <Paper
                elevation={3}
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 2,
                  bgcolor: 'black',
                  minHeight: '300px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div 
                  id={scannerElementId} 
                  style={{ 
                    width: '100%', 
                    minHeight: '300px',
                  }}
                />
                
                {!scanning && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'rgba(0,0,0,0.8)',
                      color: 'white'
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <QrCodeScannerIcon sx={{ fontSize: 64, mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Clique em "Iniciar Scanner"
                      </Typography>
                      <Typography variant="body2">
                        para começar a escanear QR Codes
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Paper>

              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Posicione o QR Code ou código de barras dentro do quadro vermelho
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={handleClose} variant="outlined">
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
} 