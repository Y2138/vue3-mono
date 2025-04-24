export function countFn() {
    let count = 0
    function addCount() {
        count ++
    }
    function getCount() {
        return count
    }
    return {
        addCount,
        getCount
    }
}