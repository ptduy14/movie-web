import countries from "data/countries"
import Link from 'next/link';

export default function SubCountries() {
    return <ul className="text-base group-hover:flex hidden absolute px-6 py-6 min-w-[50rem] right-0 bg-black h-80 flex-col flex-wrap z-10 gap-x-7 gap-y-4 before:absolute before:contents-[''] before:w-10 before:h-10 before:bg-black before:rotate-45 before:top-0 before:right-10 before:z-[-1]">
    {countries.map((item) => (
      <li key={item.slug} className='hover:text-custome-red'><Link href={`/movies/country/${item.slug}`}>{item.name}</Link></li>
    ))}
  </ul>
}