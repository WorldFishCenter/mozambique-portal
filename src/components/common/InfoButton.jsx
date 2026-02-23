import React from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

/**
 * @typedef {Object} InfoButtonProps
 * @property {string} title - The tooltip title
 * @property {string} content - The tooltip content
 * @property {'auto' | 'top' | 'bottom' | 'left' | 'right'} [placement='bottom'] - Tooltip placement
 */

/**
 * Reusable info button component with Shadcn Tooltip
 * Displays explanatory information in a tooltip when hovered
 * @param {InfoButtonProps} props
 */
const InfoButton = ({ title, content, placement = 'bottom' }) => {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
            <Info className="h-4 w-4" />
            <span className="sr-only">More info</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side={placement} className="max-w-xs">
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">{title}</h4>
            <p className="text-xs text-muted-foreground">
              {content}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default InfoButton;
