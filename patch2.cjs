const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `<div className="relative">
                                 <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-red-400" />
                                    <span className="text-[11px] font-bold text-gray-900">{fromDate ? fromDate.split('-').reverse().join('-') : 'DD-MM-YYYY'}</span>
                                 </div>
                                 <input 
                                   type="date"
                                   value={fromDate}
                                   onChange={(e) => setFromDate(e.target.value)}
                                   className="absolute inset-0 opacity-0 cursor-pointer"
                                 />
                              </div>`;

const replace1 = `<div className="relative">
                                 <CustomDatePicker value={fromDate} onChange={setFromDate} align="left">
                                    <div className="flex items-center gap-2 cursor-pointer group">
                                       <Calendar className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform" />
                                       <span className="text-[11px] font-bold text-gray-900 group-hover:text-red-500 transition-colors">{fromDate ? fromDate.split('-').reverse().join('-') : 'DD-MM-YYYY'}</span>
                                    </div>
                                 </CustomDatePicker>
                              </div>`;

const target2 = `<div className="relative">
                                 <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-red-400" />
                                    <span className="text-[11px] font-bold text-gray-900">{toDate ? toDate.split('-').reverse().join('-') : 'DD-MM-YYYY'}</span>
                                 </div>
                                 <input 
                                   type="date"
                                   value={toDate}
                                   onChange={(e) => setToDate(e.target.value)}
                                   className="absolute inset-0 opacity-0 cursor-pointer"
                                 />
                              </div>`;

const replace2 = `<div className="relative">
                                 <CustomDatePicker value={toDate} onChange={setToDate} align="left">
                                    <div className="flex items-center gap-2 cursor-pointer group">
                                       <Calendar className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform" />
                                       <span className="text-[11px] font-bold text-gray-900 group-hover:text-red-500 transition-colors">{toDate ? toDate.split('-').reverse().join('-') : 'DD-MM-YYYY'}</span>
                                    </div>
                                 </CustomDatePicker>
                              </div>`;

code = code.replace(target1, replace1);
code = code.replace(target2, replace2);

fs.writeFileSync('src/App.tsx', code);
