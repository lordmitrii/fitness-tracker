async function withOptimisticUpdate(updateFn, optimisticUpdater, effect) {
  let rollback;
  updateFn((prev) => {
    rollback = prev;
    return optimisticUpdater(prev);
  });

  try {
    await effect();
  } catch (err) {
    updateFn(() => rollback);
    throw err;
  }
}

export { withOptimisticUpdate };
