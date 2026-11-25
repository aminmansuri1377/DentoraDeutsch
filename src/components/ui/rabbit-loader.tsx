import Image from "next/image";
import styles from "./rabbit-loader.module.css";

/** Transparent compact loader; recreated from the supplied SVG animation. */
export function RabbitLoader({ size = 72 }: { size?: number }) {
  return (
    <span className={styles.loader} style={{ width: size }} aria-hidden="true">
      <svg className={styles.ring} viewBox="0 0 240 240" focusable="false">
        <circle className={styles.track} cx="120" cy="120" r="110" />
        <circle className={styles.arc} cx="120" cy="120" r="110" />
      </svg>
      <Image
        className={styles.rabbit}
        src="/loaders/rabbit-face.webp"
        alt=""
        width={616}
        height={616}
        unoptimized
      />
    </span>
  );
}
