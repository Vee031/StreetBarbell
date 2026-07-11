import Link from "next/link";
export default function NotFound() { return <div className="not-found"><span>404</span><h1>Page not found</h1><p>The requested Street Barbell page does not exist.</p><Link className="button button-red" href="/en">Back home</Link></div>; }
