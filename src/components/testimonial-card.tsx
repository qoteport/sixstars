'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Quote } from "lucide-react";
import type { Testimonial } from "@/lib/types";

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Card className="relative group overflow-hidden h-full bg-gradient-to-br from-background to-muted/30 hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
      {/* Background Quote Icon */}
      <Quote className="absolute -top-4 -right-4 w-28 h-28 text-primary/5 transform group-hover:scale-110 transition-transform duration-500" />
      
      <CardContent className="p-6 flex flex-col h-full">
        {/* Quote Content */}
        <div className="flex-grow mb-6 relative">
          <Quote className="w-6 h-6 text-primary mb-3 opacity-80" />
          <blockquote className="text-foreground/90 leading-relaxed text-base pl-2">
            "{testimonial.content}"
          </blockquote>
        </div>

        {/* Author Info */}
        <div className="flex items-center gap-4 pt-4 border-t border-border/50">
          <Avatar className="w-12 h-12 ring-2 ring-primary/20 ring-offset-2 transition-all group-hover:ring-primary/40">
            <AvatarImage src={testimonial.authorAvatarUrl} alt={testimonial.authorName} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {testimonial.authorName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">
              {testimonial.authorName}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {testimonial.authorTitle}
              {testimonial.authorTitle && testimonial.authorCompany ? ' • ' : ''}
              {testimonial.authorCompany}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}