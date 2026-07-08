import LegacyBody from '@/components/LegacyBody';
import { BODY_HTML } from './bodyHtml';

export const metadata = { title: 'Portfolio Admin — Projects' };

export default function Page() {
  return <LegacyBody html={BODY_HTML} authBody={false} needsCanvasJs={false} />;
}
