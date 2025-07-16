


export const filterQuery = (filterJson: string): Record<string, any> => {
    const filteredQuery = JSON.parse(filterJson)
    let query: Record<string, any> = {}
    for (const { field ,value} of filteredQuery)
        if (!isNaN(Number(value))) {
            query[field] = Number(value)
        }
        else {
            query[field] = new RegExp(value,"i")
        }
    return query;
}

