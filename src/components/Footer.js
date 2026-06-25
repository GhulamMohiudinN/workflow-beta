export const Footer = ({
  copyrightText = "WorkflowPro AI",
  year = new Date().getFullYear(),
}) => {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-3 text-[11px] font-semibold text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between">
        <p>
          {copyrightText} © {year}. All rights reserved.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <a href="#" className="hover:text-[var(--color-text)]">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-[var(--color-text)]">
            Terms of Service
          </a>
          <span className="inline-flex items-center gap-1.5 text-[var(--color-text)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
            System Status: Healthy
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
