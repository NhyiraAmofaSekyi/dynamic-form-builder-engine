import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {getExampleSchema, updateExampleSchema, validateSubmission} from "#/services/schema.ts";


// Fetch + cache the form schema. Schema changes rarely, so a generous
// staleTime avoids refetching on every mount. The returned object gives you
// isLoading / isError / data — exactly the three UI states the form needs.
export function useExampleSchema() {
  return useQuery({
    queryKey: ['example-schema'],
    queryFn: getExampleSchema,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Validation is an action, not cached data — so it's a mutation. Call
// mutate(payload) / mutateAsync(payload) on submit; the result's `errors`
// array feeds straight into antd's form.setFields(...).
export function useValidateSubmission() {
  return useMutation({
    mutationFn: validateSubmission,
  })
}


export function useUpdateSchema() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateExampleSchema,
    onSuccess: () => {
      // the cached schema is now stale — refetch so any GET reflects the save
      queryClient.invalidateQueries({ queryKey: ["example-schema"] });
    },
  });
}