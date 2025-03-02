import { CgProfile } from 'react-icons/cg';
import { useAuthModel } from '../context/auth-modal-context';

export default function LoginSignUpIcon() {
  const { openAuthModal } = useAuthModel();
  return (
    <>
      <CgProfile
        className={`cursor-pointer hover:text-custome-red]`}
        size={25}
        onClick={() => openAuthModal()}
      />
    </>
  );
}
