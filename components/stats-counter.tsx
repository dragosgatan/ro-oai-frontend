'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { fadeUpVariants } from '@/lib/animations';
import { useLocale } from '@/hooks/use-locale';
import { formatInteger } from '@/lib/i18n-formatting';

interface Stat {
    value: number;
    label: string;
    icon: LucideIcon;
    suffix?: string;
}

interface StatsCounterProps {
    stats: Stat[];
}

export function StatsCounter({ stats }: StatsCounterProps) {
    return (
        <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
            role="region"
            aria-label="Platform statistics"
        >
            {stats.map((stat, index) => (
                <StatCard key={index} stat={stat} index={index} />
            ))}
        </div>
    );
}

interface StatCardProps {
    stat: Stat;
    index: number;
}

function StatCard({ stat, index }: StatCardProps) {
    const { locale } = useLocale();
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    setIsVisible(true);
                    hasAnimated.current = true;
                }
            },
            { threshold: 0.3 },
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        const duration = 2000; // 2 seconds
        const steps = 60;
        const increment = stat.value / steps;
        const stepDuration = duration / steps;

        let currentStep = 0;
        const timer = setInterval(() => {
            currentStep++;
            if (currentStep >= steps) {
                setCount(stat.value);
                clearInterval(timer);
            } else {
                setCount(Math.floor(increment * currentStep));
            }
        }, stepDuration);

        return () => clearInterval(timer);
    }, [isVisible, stat.value]);

    const Icon = stat.icon;

    return (
        <motion.div
            ref={ref}
            variants={fadeUpVariants}
            initial="hidden"
            animate={isVisible ? 'visible' : 'hidden'}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center text-center p-6 rounded-lg bg-card border hover:shadow-lg transition-shadow"
            role="article"
            aria-label={`${stat.label}: ${formatInteger(stat.value, locale)}${stat.suffix || ''}`}
        >
            {/* Icon with pulse animation */}
            <motion.div
                animate={
                    isVisible
                        ? {
                              scale: [1, 1.1, 1],
                          }
                        : {}
                }
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                }}
                className="mb-4 p-3 rounded-full bg-primary/10 text-primary"
                aria-hidden="true"
            >
                <Icon className="h-8 w-8" />
            </motion.div>

            {/* Counter */}
            <div
                className="text-4xl md:text-5xl font-bold mb-2"
                aria-live="polite"
                aria-atomic="true"
            >
                {formatInteger(count, locale)}
                {stat.suffix}
            </div>

            {/* Label */}
            <div className="text-sm md:text-base text-muted-foreground">{stat.label}</div>
        </motion.div>
    );
}
