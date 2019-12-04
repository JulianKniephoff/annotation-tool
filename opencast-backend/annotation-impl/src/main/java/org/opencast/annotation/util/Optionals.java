/**
 *  Copyright 2017, ELAN e.V., Germany
 *  Licensed under the Educational Community License, Version 2.0
 *  (the "License"); you may not use this file except in compliance
 *  with the License. You may obtain a copy of the License at
 *
 *  http://www.osedu.org/licenses/ECL-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an "AS IS"
 *  BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 *  or implied. See the License for the specific language governing
 *  permissions and limitations under the License.
 *
 */
package org.opencast.annotation.util;

import org.opencastproject.util.data.Option.Match;

import java.util.functional.Function;
import java.util.functional.Supplier;

// TODO Primitive cases?
public class Optionals {

  public class SomeCase<T, R> {
    private final Function<T, R> f;

    private SomeCase(Function<T, R> f) {
      this.f = f;
    }
  }

  public static <T, R> SomeCase<T, R> some(Function<T, R> f) {
    return new SomeCase<T, R>(f);
  }

  public class NoneCase<R> {
    private final Supplier<R> f;

    private NoneCase(Supplier<R> f) {
      this.f = f;
    }
  }

  public static <R> NoneCase<R> none(Supplier<R> f) {
    return new NoneCase<R>(f);
  }

  public static <T, R> Match<T, R> match(SomeCase<T, R> some, NoneCase<R> none) {
    return new Match<T, R>() {
      R some(T t) {
        return some.f(t);
      }
      R none() {
        return none.f();
      }
    }
  }
}
