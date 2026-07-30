import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Kicker } from '@/components/ui/Primitives';

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-20">
      <div className="paper-block halftone-field p-6 text-center sm:p-8">
        <Kicker as="p">Not in this edition</Kicker>

        <h1 className="misprint mt-3 font-display text-display-md uppercase leading-[0.82]">
          404
        </h1>

        <p className="mt-4 font-body text-ink-soft">
          That page was never printed, or it has been pulled from circulation.
        </p>

        <Link href="/" className="mt-7 inline-block">
          <Button variant="marker">Back to the front page</Button>
        </Link>
      </div>
    </div>
  );
}
