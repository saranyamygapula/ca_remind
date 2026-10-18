import { Logo } from "@/components/common/Logo";
import {
    Smartphone,
    Headset,
    Wrench,
    TrendingUp,
    Phone,
    Mail,
    Headphones,
    ArrowRight,
} from "lucide-react";

const services = [
    {
        icon: Smartphone,
        title: "RemindCA App",
        description:
            "Manage your business effortlessly with our user-friendly app.",
    },
    {
        icon: Headset,
        title: "Agent Services",
        description:
            "Our dedicated team of experts is committed to your success. Benefit from personalized service, market expertise, and 24/7 support.",
    },
    {
        icon: Wrench,
        title: "Custom Solutions",
        description:
            "Tailored solutions to meet your unique business needs. From personalized reminders to specialized support, we adapt to serve you better.",
    },
    {
        icon: TrendingUp,
        title: "Business Growth",
        description:
            "Unlock your business potential with our growth strategies. We help you scale new heights and achieve your goals.",
    },
];

const contacts = [
    {
        icon: Phone,
        title: "Talk with Agent",
        value: "+91 8866189222",
        href: "tel:+918866189222",
    },
    {
        icon: Mail,
        title: "Connect with Agent",
        value: "support@remindca.com",
        href: "mailto:support@remindca.com",
    },
];

export default function TalkWithAgent() {
    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
            <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="space-y-8">

                    {/* Header */}
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)]/10">
                                <Headphones className="h-5 w-5 text-[var(--primary)]" />
                            </div>

                            <h1 className="text-2xl font-bold text-[var(--heading)]">
                                Talk With Agent
                            </h1>
                        </div>

                        <p className="mt-2 text-sm text-[var(--text-secondary)]">
                            Get personalized support and grow your business with RemindCA
                        </p>
                    </div>

                    {/* Hero */}
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                        <div className="p-6 sm:p-8">
                            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">

                                <div>
                                    <span className="inline-flex rounded-md bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--primary)]">
                                        Trusted by CA Firms
                                    </span>
<div className="m-2">
                                   <Logo/>
                                   </div>

                                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                        Manage your Business efficiently
                                    </p>
                                </div>

                                {/* Stats */}
                                <div className="flex overflow-hidden rounded-xl border border-[var(--border)]">
                                    {[
                                        { value: "500+", label: "CA Firms" },
                                        { value: "24/7", label: "Support" },
                                        { value: "99%", label: "Uptime" },
                                    ].map((stat, index) => (
                                        <div
                                            key={stat.label}
                                            className={`min-w-[100px] px-5 py-4 text-center ${index !== 0
                                                ? "border-l border-[var(--border)]"
                                                : ""
                                                }`}
                                        >
                                            <div className="text-xl font-extrabold text-[var(--primary)]">
                                                {stat.value}
                                            </div>

                                            <div className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
                                                {stat.label}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Services */}
                    <section>
                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-[var(--heading)]">
                                    Our Services
                                </h2>

                                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                    Everything you need to run your CA firm efficiently
                                </p>
                            </div>

                            <span className="w-fit rounded-md bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--primary)]">
                                {services.length} Services
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {services.map((service) => {
                                const Icon = service.icon;

                                return (
                                    <div
                                        key={service.title}
                                        className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-md"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-start gap-4">

                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                                                    <Icon className="h-5 w-5" />
                                                </div>

                                                <div>
                                                    <h3 className="font-bold text-[var(--heading)]">
                                                        {service.title}
                                                    </h3>

                                                    <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                                                        {service.description}
                                                    </p>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Contact */}
                    <section>
                        <div className="mb-6 h-px bg-[var(--border)]" />

                        <div className="mb-5">
                            <h2 className="text-xl font-bold text-[var(--heading)]">
                                Get in Touch
                            </h2>

                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                Our team is ready to help you succeed
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {contacts.map((contact) => {
                                const Icon = contact.icon;

                                return (
                                    <a
                                        key={contact.title}
                                        href={contact.href}
                                        className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-4 p-6">

                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                                                <Icon className="h-5 w-5" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium text-[var(--text-secondary)]">
                                                    {contact.title}
                                                </p>

                                                <p className="mt-1 truncate text-sm font-bold text-[var(--text-primary)]">
                                                    {contact.value}
                                                </p>
                                            </div>

                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] transition-transform group-hover:translate-x-1">
                                                <ArrowRight className="h-4 w-4" />
                                            </div>

                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}