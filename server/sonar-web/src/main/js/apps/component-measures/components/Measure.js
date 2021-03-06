/*
 * SonarQube
 * Copyright (C) 2009-2016 SonarSource SA
 * mailto:contact AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
import React from 'react';
import Rating from '../../../components/ui/Rating';
import Level from '../../../components/ui/Level';
import { formatMeasure } from '../../../helpers/measures';
import { TooltipsContainer } from '../../../components/mixins/tooltips-mixin';
import { formatLeak, isDiffMetric, getRatingTooltip } from '../utils';

const Measure = ({ measure, metric }) => {
  const finalMetric = metric || measure.metric;

  if (finalMetric.type === 'RATING') {
    const tooltip = getRatingTooltip(finalMetric.key, measure.value);
    const rating = <Rating value={measure.value}/>;
    if (tooltip) {
      return (
          <TooltipsContainer>
            <span>
              <span title={tooltip} data-toggle="tooltip">
                {rating}
              </span>
            </span>
          </TooltipsContainer>
      );
    }
    return rating;
  }

  if (finalMetric.type === 'LEVEL') {
    return <Level level={measure.value}/>;
  }

  const formattedValue = isDiffMetric(finalMetric) ?
      formatLeak(measure.leak, finalMetric) :
      formatMeasure(measure.value, finalMetric.type);

  return (
      <span>
        {formattedValue != null ? formattedValue : '–'}
      </span>
  );
};

export default Measure;
