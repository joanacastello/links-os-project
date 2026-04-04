import ProjectShowcaseScreen from './ProjectShowcaseScreen';

type Zero2HeroScreenProps = Readonly<{
  onBack: () => void;
}>;

export default function Zero2HeroScreen({ onBack }: Zero2HeroScreenProps) {
  return (
    <ProjectShowcaseScreen
      onBack={onBack}
      iconSrc="/zero2hero/zero2hero-icon.png"
      iconAlt="Zero2Hero"
      title="Zero2Hero"
      subtitle="Plataforma de Trading · SaaS"
      ctaLabel="Ver proyecto"
      ctaHref="https://zero2herobot.com?ref=0664E670"
      stats={[
        { label: 'Tiempo de Build', value: '2 meses' },
        { label: 'Ingreso al cliente', value: '110K$' },
        { label: 'Usuarios activos', value: '+600' },
      ]}
      features={[
        'Pagos y retiros en la blockchain',
        'Dashboard de afiliados',
        'Área de miembros con tutoriales',
        'Sistema de referidos on-chain',
        'Autenticación y gestión de roles',
        'Soporte Chatbot IA en Telegram',
      ]}
      previewImages={['/zero2hero/prev1.png', '/zero2hero/prev2.png', '/zero2hero/prev3.png']}
      description="Plataforma para acceder a una estrategia de copytrading algorítmico en Oro. Los usuarios se registran, pagan el acceso y siguen tutoriales paso a paso para conectar su broker. Incluye programa de referidos con comisiones automáticas en USDT."
      stack="Next.js · Neon · Vercel · Resend · Cursor · NowPayments"
    />
  );
}
