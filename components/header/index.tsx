"use client";
import { useEffect, useState } from "react";
import HeaderDefault from "./header-default";
import HeaderFixed from "./header-fixed";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        if (window.scrollY == 0) {
          setIsScrolled(false);
        }

      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return <>
    <HeaderDefault isScrolled={isScrolled}/>
    <HeaderFixed isScrolled={isScrolled}/>
  </>
}
