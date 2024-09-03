import { FaGithub } from 'react-icons/fa';

export default function Footer() {
  return (
    <div className="w-full py-1 border-t-[1px] border-gray-400">
      <a href="https://github.com/ptduy14/movie-web" className='flex items-center justify-center gap-x-2 text-gray-400 hover:text-white transition-all duration-300'>
        <span>An open source project</span>
        <FaGithub />
      </a>
    </div>
  );
}
