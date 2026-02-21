import { Link } from 'react-router-dom';
import { FileText, Search, CheckCircle, ArrowRight } from 'lucide-react';

export function HowItWorksPreview() {
  const steps = [
    {
      icon: FileText,
      title: 'Post a Bounty',
      description: 'Describe what you\'re looking for and set your reward.',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: Search,
      title: 'Hunters Search',
      description: 'ID-verified hunters compete to find your item.',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      icon: CheckCircle,
      title: 'Pay on Success',
      description: 'Only pay when you accept a verified find.',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  return (
    <section className="py-6 lg:py-10 bg-muted/30 border-b border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              {/* Connector line for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-border" />
              )}
              
              <div className="flex flex-col items-center text-center">
                {/* Step number + icon */}
                <div className="relative mb-2 sm:mb-4">
                  <div className={`w-10 h-10 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full ${step.bgColor} flex items-center justify-center`}>
                    <step.icon className={`h-5 w-5 sm:h-7 sm:w-7 lg:h-8 lg:w-8 ${step.color}`} />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-foreground text-background rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold">
                    {index + 1}
                  </div>
                </div>

                {/* Text */}
                <h3 className="text-xs sm:text-base lg:text-lg font-semibold text-foreground mb-0.5 sm:mb-1.5">
                  {step.title}
                </h3>
                <p className="text-[10px] sm:text-sm text-muted-foreground leading-snug sm:leading-relaxed max-w-[200px]">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Learn more link */}
        <div className="mt-4 sm:mt-8 text-center">
          <Link 
            to="/how-it-works" 
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Learn more about how BountyBay works
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
