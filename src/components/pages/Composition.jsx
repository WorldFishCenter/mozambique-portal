import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import TaxaLengthChart from '../charts/TaxaLengthChart';
import TaxaProportionsChart from '../charts/TaxaProportionsChart';
import { getTaxaLength, getTaxaSites } from '../../services/dataService';
import InfoButton from '../common/InfoButton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

/**
 * Component that displays taxa length distribution and catch composition
 * with a tabbed interface
 */
const TaxaLength = () => {
  const { theme } = useTheme();
  const lengthData = getTaxaLength();
  const proportionsData = getTaxaSites();

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Fish Taxa Analysis</h2>
        <p className="text-muted-foreground">
          Length distribution and catch composition of different fish taxa
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            {/* Header content moved to tabs list context potentially, or kept generic */}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="composition" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="composition">Catch Composition</TabsTrigger>
                <TabsTrigger value="length">Length Distribution</TabsTrigger>
              </TabsList>
              <InfoButton
                title="Fish Taxa Analysis"
                content="The Catch Composition chart shows the proportion of different fish taxa (species groups) caught across all landing sites. The Length Distribution chart displays the ranked size distribution of fish catches for different taxa."
                placement="bottom"
              />
            </div>

            <TabsContent value="composition" className="mt-0">
              <div className="h-[600px] w-full relative">
                {/* @ts-ignore */}
                <TaxaProportionsChart data={proportionsData} theme={theme} />
              </div>
            </TabsContent>

            <TabsContent value="length" className="mt-0">
              <div className="h-[600px] w-full relative">
                {/* @ts-ignore */}
                <TaxaLengthChart data={lengthData} theme={theme} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxaLength;