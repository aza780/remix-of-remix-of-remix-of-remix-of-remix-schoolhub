import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { signOut } from '@backend/auth/auth';
import { toast } from 'sonner';

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const logout = async () => {
    try {
      await signOut();
      // Clear all TanStack Query caches so previous user's data doesn't leak
      queryClient.clear();
      toast.success('Berhasil keluar. Sampai jumpa! 👋');
      navigate({ to: '/' });
    } catch {
      toast.error('Gagal keluar. Silakan coba lagi.');
    }
  };

  return logout;
}
