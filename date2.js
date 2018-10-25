var moment = require('moment');

moment().add(2,'days').fromNow();
// 'in 2 days'

moment().subtract( 2,'days').fromNow();
// '2 days ago'

//moment('November 1977').fromNow()
// '34 years ago'

moment().add(2,'days').calendar();
// 'Monday at 8:30 AM'
var d = new Date();
console.log(d.getTime());
var s=moment().utcOffset('+0530').subtract((((moment().valueOf()-1514560281000)/1000)/60),'minutes').calendar();
console.log(s);
// 'last Thursday at 8:30 AM'

//moment('1977-08-20 14:29:00 UTC').format('MMM. d, YYYY');
// 'Aug. 5, 1977'

//moment('1977-08-20 14:29:00 UTC').fromNow();
// 'il y a 35 années'
