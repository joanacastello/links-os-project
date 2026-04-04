import ProjectShowcaseScreen from './ProjectShowcaseScreen';

type OnAnemScreenProps = Readonly<{
  onBack: () => void;
}>;

export default function OnAnemScreen({ onBack }: OnAnemScreenProps) {
  return (
    <ProjectShowcaseScreen
      onBack={onBack}
      iconSrc="/onanem/onanem-icon.png"
      iconAlt="On Anem"
      title="On Anem Valencia"
      subtitle="Falles 2025 · App de eventos"
      ctaLabel="Ver proyecto"
      ctaHref="https://www.onanemvalencia.com/"
      stats={[
        { label: 'Tiempo de Build', value: '24h' },
        { label: 'Categoría', value: 'Web App' },
        { label: 'Usuarios', value: '+1500' },
      ]}
      features={[
        'Mapa de reacciones en tiempo real',
        'Compartir ubicación con amigos',
        'Eventos filtrados por género musical',
        'CMS para fallas y usuarios',
        'Multidioma (3 idiomas)',
        'Auth con Clerk + BD en Neon',
      ]}
      previewImages={['/onanem/prev1.jpg', '/onanem/prev2.jpg', '/onanem/prev3.jpg']}
      description="App interactiva para vivir las Fallas de Valencia al máximo. Visualiza en tiempo real carpas, baños públicos y fiestas filtradas por género musical. La funcionalidad estrella: deja reacciones sobre el mapa para mostrar dónde hay ambiente ahora mismo. Comparte tu ubicación en vivo con amigos para no perderos. Las fallas pueden publicar sus propios eventos y los usuarios añadir los suyos. Multidioma: valencià, español e inglés."
      stack="Next.js · Neon · Clerk · Leaflet"
    />
  );
}
