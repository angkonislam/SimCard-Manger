const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/<div className="flex items-center gap-2">\s*<Calendar className="w-3\.5 h-3\.5 text-red-400" \/>\s*<span className="text-\[11px\] font-bold text-gray-900">\{fromDate \? fromDate\.split\('-\'\)\.reverse\(\)\.join\('-\'\) \: 'DD-MM-YYYY'\}<\/span>\s*<\/div>\s*<input[^>]+value=\{fromDate\}[^>]*\/>/gs, 
`<CustomDatePicker value={fromDate} onChange={setFromDate} align="left">
                                 <div className="flex items-center gap-2 cursor-pointer group">
                                    <Calendar className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-[11px] font-bold text-gray-900 group-hover:text-red-500 transition-colors">{fromDate ? fromDate.split('-').reverse().join('-') : 'DD-MM-YYYY'}</span>
                                 </div>
                              </CustomDatePicker>`);

code = code.replace(/<div className="flex items-center gap-2">\s*<Calendar className="w-3\.5 h-3\.5 text-red-400" \/>\s*<span className="text-\[11px\] font-bold text-gray-900">\{toDate \? toDate\.split\('-\'\)\.reverse\(\)\.join\('-\'\) \: 'DD-MM-YYYY'\}<\/span>\s*<\/div>\s*<input[^>]+value=\{toDate\}[^>]*\/>/gs, 
`<CustomDatePicker value={toDate} onChange={setToDate} align="left">
                                 <div className="flex items-center gap-2 cursor-pointer group">
                                    <Calendar className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-[11px] font-bold text-gray-900 group-hover:text-red-500 transition-colors">{toDate ? toDate.split('-').reverse().join('-') : 'DD-MM-YYYY'}</span>
                                 </div>
                              </CustomDatePicker>`);

fs.writeFileSync('src/App.tsx', code);
