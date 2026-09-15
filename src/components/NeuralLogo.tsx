type NeuralLogoProps = { className?: string };

/** The supplied transparent logo asset, reusable anywhere the brand is shown. */
export default function NeuralLogo({ className = "" }: NeuralLogoProps) {
  return (
    <img
      src="/icon-clean.png"
      alt="Neuro Networks"
      className={`brand-logo object-contain ${className}`}
    />
  );
}
