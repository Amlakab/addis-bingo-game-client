'use client';

import { FiPlusCircle } from "react-icons/fi";
import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, Alert, Snackbar, CircularProgress
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AccountBalance, Phone, Person, Block, CheckCircle, Edit, Delete
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { Accountant } from '@/types';
import { formatDate } from '@/lib/date';
import { useAuth } from '@/lib/auth';

export default function AccountantsPage() {
  const { user } = useAuth();
  const [accountants, setAccountants] = useState<Accountant[]>([]);
  const [filteredAccountants, setFilteredAccountants] = useState<Accountant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'blocked'>('all');

  const [openDialog, setOpenDialog] = useState(false);
  const [editingAccountant, setEditingAccountant] = useState<Accountant | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    accountNumber: '',
    bankName: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch accountants
  const fetchAccountants = async () => {
    try {
      setLoading(true);
      let url = '/accountants';
      if (filter !== 'all') url += `?blocked=${filter === 'blocked'}`;
      const response = await api.get(url);
      setAccountants(response.data.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch accountants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') fetchAccountants();
  }, [user, filter]);

  useEffect(() => {
    const filtered = accountants.filter(acc => {
      if (filter === 'all') return true;
      if (filter === 'active') return !acc.isBlocked;
      if (filter === 'blocked') return acc.isBlocked;
      return true;
    });
    setFilteredAccountants(filtered);
  }, [filter, accountants]);

  // Form handlers
  const handleOpenDialog = (accountant: Accountant | null = null) => {
    if (accountant) {
      setEditingAccountant(accountant);
      setFormData({
        fullName: accountant.fullName,
        phoneNumber: accountant.phoneNumber,
        accountNumber: accountant.accountNumber,
        bankName: accountant.bankName
      });
    } else {
      setEditingAccountant(null);
      setFormData({ fullName: '', phoneNumber: '', accountNumber: '', bankName: '' });
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAccountant(null);
    setFormData({ fullName: '', phoneNumber: '', accountNumber: '', bankName: '' });
    setErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => { const newErrors = { ...prev }; delete newErrors[name]; return newErrors; });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!/^\d{10,15}$/.test(formData.phoneNumber)) newErrors.phoneNumber = 'Phone number must be 10-15 digits';
    if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Account number is required';
    if (!/^\d{9,18}$/.test(formData.accountNumber)) newErrors.accountNumber = 'Account number must be 9-18 digits';
    if (!formData.bankName.trim()) newErrors.bankName = 'Bank name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      if (editingAccountant) {
        await api.put(`/accountants/${editingAccountant._id}`, formData);
        setSuccess('Accountant updated successfully');
      } else {
        await api.post('/accountants', formData);
        setSuccess('Accountant created successfully');
      }
      handleCloseDialog();
      fetchAccountants();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this accountant?')) return;
    try {
      await api.delete(`/accountants/${id}`);
      setSuccess('Accountant deleted successfully');
      fetchAccountants();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete accountant');
    }
  };

  const handleBlock = async (accountant: Accountant) => {
    if (!confirm(`Are you sure you want to ${accountant.isBlocked ? 'unblock' : 'block'} this accountant?`)) return;
    try {
      await api.patch(`/accountants/${accountant._id}/block`, { isBlocked: !accountant.isBlocked });
      setSuccess(`Accountant ${accountant.isBlocked ? 'unblocked' : 'blocked'} successfully`);
      fetchAccountants();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  if (user?.role !== 'admin') {
    return <div className="text-center py-8 text-red-600">Access denied. Admin only.</div>;
  }

  return (
    <Box sx={{ p: 3, minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>Accountants Management</Typography>
          <Button
            variant="contained"
            onClick={() => handleOpenDialog()}
            sx={{
              background: 'linear-gradient(145deg, #3498db, #2980b9)',
              borderRadius: 2,
              px: 2,
              py: 1,
              "&:hover": { background: "linear-gradient(145deg, #2980b9, #2471a3)" }
            }}
          >
            <FiPlusCircle size={22} />
          </Button>
        </Box>
      </motion.div>

      {/* Filter Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          <Card onClick={() => setFilter('all')} sx={{ flex: '1 1 30%', cursor: 'pointer', background: filter === 'all' ? '#3498db' : '#ecf0f1', color: filter === 'all' ? 'white' : 'black', borderRadius: 3, p: 2, textAlign: 'center' }}>
            <Typography>All</Typography>
            <Typography variant="h6">{accountants.length}</Typography>
          </Card>
          <Card onClick={() => setFilter('active')} sx={{ flex: '1 1 30%', cursor: 'pointer', background: filter === 'active' ? '#2ecc71' : '#ecf0f1', color: filter === 'active' ? 'white' : 'black', borderRadius: 3, p: 2, textAlign: 'center' }}>
            <Typography>Active</Typography>
            <Typography variant="h6">{accountants.filter(a => !a.isBlocked).length}</Typography>
          </Card>
          <Card onClick={() => setFilter('blocked')} sx={{ flex: '1 1 30%', cursor: 'pointer', background: filter === 'blocked' ? '#e74c3c' : '#ecf0f1', color: filter === 'blocked' ? 'white' : 'black', borderRadius: 3, p: 2, textAlign: 'center' }}>
            <Typography>Blocked</Typography>
            <Typography variant="h6">{accountants.filter(a => a.isBlocked).length}</Typography>
          </Card>
        </Box>
      </motion.div>

      {/* Accountant Cards */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress size={60} sx={{ color: '#3498db' }} />
        </Box>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
            <AnimatePresence>
              {filteredAccountants.map((acc, index) => (
                <motion.div key={acc._id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3, delay: index * 0.1 }} whileHover={{ scale: 1.02 }}>
                  <Card sx={{ borderRadius: 3, boxShadow: '0 8px 16px rgba(0,0,0,0.1)', background: 'linear-gradient(145deg, #ffffff, #f8f9fa)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}><Person /> {acc.fullName}</Typography>
                      <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}><Phone fontSize="small" /> {acc.phoneNumber}</Typography>
                      <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}><AccountBalance fontSize="small" /> {acc.bankName} ({acc.accountNumber})</Typography>
                      <Chip icon={acc.isBlocked ? <Block /> : <CheckCircle />} label={acc.isBlocked ? 'Blocked' : 'Active'} color={acc.isBlocked ? 'error' : 'success'} sx={{ mt: 1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Created: {formatDate(acc.createdAt)}</Typography>
                    </CardContent>
                    <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                      <Button variant="outlined" startIcon={<Edit />} onClick={() => handleOpenDialog(acc)} fullWidth sx={{ borderRadius: 2, borderColor: '#3498db', color: '#3498db', '&:hover': { borderColor: '#2980b9', background: 'rgba(52,152,219,0.1)' } }}>Edit</Button>
                      <Button variant="outlined" startIcon={<Delete />} onClick={() => handleDelete(acc._id)} fullWidth sx={{ borderRadius: 2, borderColor: '#e74c3c', color: '#e74c3c', '&:hover': { borderColor: '#c0392b', background: 'rgba(231,76,60,0.1)' } }}>Delete</Button>
                      <Button variant="outlined" onClick={() => handleBlock(acc)} fullWidth sx={{ borderRadius: 2, borderColor: acc.isBlocked ? '#2ecc71' : '#f1c40f', color: acc.isBlocked ? '#2ecc71' : '#f1c40f', '&:hover': { background: acc.isBlocked ? 'rgba(46,204,113,0.1)' : 'rgba(241,196,15,0.1)' } }}>{acc.isBlocked ? 'Unblock' : 'Block'}</Button>
                    </Box>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </Box>

          {filteredAccountants.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="h6" color="text.secondary">No accountants found.</Typography>
            </Box>
          )}
        </motion.div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingAccountant ? 'Edit Accountant' : 'Add New Accountant'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Full Name" name="fullName" value={formData.fullName} onChange={handleInputChange} margin="normal" error={!!errors.fullName} helperText={errors.fullName} />
          <TextField fullWidth label="Phone Number" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} margin="normal" error={!!errors.phoneNumber} helperText={errors.phoneNumber} />
          <TextField fullWidth label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} margin="normal" error={!!errors.accountNumber} helperText={errors.accountNumber} />
          <TextField fullWidth label="Bank Name" name="bankName" value={formData.bankName} onChange={handleInputChange} margin="normal" error={!!errors.bankName} helperText={errors.bankName} />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ borderRadius: 2, px: 3, background: 'linear-gradient(145deg, #3498db, #2980b9)', '&:hover': { background: 'linear-gradient(145deg, #2980b9, #2471a3)' } }}>{editingAccountant ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')}>
        <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
      </Snackbar>
    </Box>
  );
}
