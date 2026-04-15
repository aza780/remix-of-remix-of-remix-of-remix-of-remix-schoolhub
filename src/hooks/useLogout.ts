import { useNavigate } from '@tanstack/react-router';
import { signOut } from '@/lib/auth';
import { toast } from 'sonner';

export function useLogout() {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await signOut();
      toast.success('Berhasil keluar. Sampai jumpa! 👋');
      navigate({ to: '/' });
    } catch {
      toast.error('Gagal keluar. Silakan coba lagi.');
    }
  };

  return logout;
}
