const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/<div className="relative">\s*<div className="flex items-center gap-2">\s*<Calendar className="w-3\.5 h-3\.5 text-red-400" \/>\s*<span className="text-\[11px\] font-bold text-gray-900">\{fromDate \? fromDate\.split\('-\'\)\.reverse\(\)\.join\('-\'\) \: 'DD-MM-YYYY'\}<\/span>\s*<\/div>\s*<input\s+type="date"\s+value=\{fromDate\}\s+onChange=\{\(e\) => setFromDate\(e\.target\.value\)\}\s+className="absolute inset-0 opacity-0 cursor-pointer"\s+\/>\s*<\/div>/g, 
`<div className="relative">
                                 <CustomDatePicker value={fromDate} onChange={setFromDate} align="left">
                                    <div className="flex items-center gap-2 cursor-pointer group">
                                       <Calendar className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform" />
                                       <span className="text-[11px] font-bold text-gray-900 group-hover:text-red-500 transition-colors">{fromDate ? fromDate.split('-').reverse().join('-') : 'DD-MM-YYYY'}</span>
                                    </div>
                                 </CustomDatePicker>
                              </div>`);

code = code.replace(/<div className="relative">\s*<div className="flex items-center gap-2">\s*<Calendar className="w-3\.5 h-3\.5 text-red-400" \/>\s*<span className="text-\[11px\] font-bold text-gray-900">\{toDate \? toDate\.split\('-\'\)\.reverse\(\)\.join\('-\'\) \: 'DD-MM-YYYY'\}<\/span>\s*<\/div>\s*<input\s+type="date"\s+value=\{toDate\}\s+onChange=\{\(e\) => setToDate\(e\.target\.value\)\}\s+className="absolute inset-0 opacity-0 cursor-pointer"\s+\/>\s*<\/div>/g, 
`<div className="relative">
                                 <CustomDatePicker value={toDate} onChange={setToDate} align="left">
                                    <div className="flex items-center gap-2 cursor-pointer group">
                                       <Calendar className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform" />
                                       <span className="text-[11px] font-bold text-gray-900 group-hover:text-red-500 transition-colors">{toDate ? toDate.split('-').reverse().join('-') : 'DD-MM-YYYY'}</span>
                                    </div>
                                 </CustomDatePicker>
                              </div>`);

fs.writeFileSync('src/App.tsx', code);
