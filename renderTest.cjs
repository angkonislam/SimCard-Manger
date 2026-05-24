import React from 'react';
import { renderToString } from 'react-dom/server';
import { DayPicker } from 'react-day-picker';

const html = renderToString(React.createElement(DayPicker, { captionLayout: "dropdown", startMonth: new Date(2000, 0), endMonth: new Date(2050, 11) }));
console.log(html);
