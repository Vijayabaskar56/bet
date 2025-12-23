import { Injectable } from '@angular/core';
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import {
  createTanstackQueryUtils
} from '@orpc/tanstack-query';
import { QueryCache, QueryClient } from '@tanstack/angular-query-experimental';
import { toast } from 'ngx-sonner';
import { appRouter } from '@betting/api/routers/index';
import { RouterClient } from '@orpc/server'
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class ORPCService {
  private queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        toast.error(`Error: ${error.message}`, {
          action: {
            label: "retry",
            onClick: () => {
              this.queryClient.invalidateQueries();
            },
          },
        });
      },
    }),
  });

  private link = new RPCLink({
    url: `${environment.base_url}/rpc`,
    fetch(url, options) {
      return fetch(url, {
        ...options,
        credentials: "include",
      });
    },
  });

  private client: RouterClient<typeof appRouter> = createORPCClient(this.link);
  public utils = createTanstackQueryUtils(this.client);
  getQueryClient(): QueryClient {
    return this.queryClient;
  }
}