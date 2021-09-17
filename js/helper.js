// Change <> to non html tags
export const replace = (data) => {
  let replaced = data.replace('<', '&lt').replace('>', '&gt');
  return replaced;
}