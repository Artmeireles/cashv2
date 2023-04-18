module.exports = app => {
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function titleCase(str) {
        let splitStr = str.toLowerCase().split(' ');
        const pular = ['de', 'da', '']
        for (var i = 0; i < splitStr.length; i++) {
            if (!(pular.includes(splitStr[i])))
                splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
        }
        return splitStr.join(' ');
    }

    return { capitalizeFirstLetter, titleCase }
}