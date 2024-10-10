import { CgProfile } from 'react-icons/cg';
import LoginSignUpDropdown from './login-signup-dropdown';

export default function LoginSignUpIcon({ isScrolled }: { isScrolled: boolean }) {
  return (
    <>
        <CgProfile className={`cursor-pointer hover:text-[#e10711]`} size={25} />
        <LoginSignUpDropdown />
    </>
  );
}
