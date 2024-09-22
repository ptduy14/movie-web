"use client";
import { useRef, useEffect } from "react";

export default function MovieSummary({summary}:{summary: string}) {
    const contentRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (contentRef.current) contentRef.current.innerHTML = summary;
      }, [])

    return <div ref={contentRef}></div>
}