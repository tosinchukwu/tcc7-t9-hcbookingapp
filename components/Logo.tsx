import Image from "next/image";

export default function Logo() {
  return (
    <div className="flex items-center gap-2 h-12 sm:h-14">
      <Image
        src="/logo.png"
        alt="MEDCRUSH Logo"
        width={60}
        height={60}
        className="object-contain h-8 sm:h-10 w-auto"
        priority
      />
      <div className="flex flex-col leading-tight">
        <span className="text-base sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
          MEDCRUSH
        </span>
        <span className="text-[8px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider uppercase">
          Blockchain Hospital
        </span>
      </div>
    </div>
  );
}