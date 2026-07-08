import LegacyBody from '@/components/LegacyBody';
import { BODY_HTML } from './bodyHtml';

export const metadata = { title: 'Portfolio Admin — Technologies' };

export default function Page() {
  return <LegacyBody html={BODY_HTML} authBody={false} needsCanvasJs={false} />;
}
