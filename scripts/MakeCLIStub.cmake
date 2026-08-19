# Part of the Fluid Corpus Manipulation Project (http://www.flucoma.org/)
# Copyright University of Huddersfield.
# Licensed under the BSD-3 License.
# See license.md file in the project root for full license information.
# This project has received funding from the European Research Council (ERC)
# under the European Union’s Horizon 2020 research and innovation programme
# (grant agreement No 725899).

cmake_minimum_required(VERSION 3.18)

include(FluidClientStub)

function(make_external_name client header output-var) 
  string(REPLACE "Buf" "fluid-" client ${client})
  string(TOLOWER ${client} client)
  set(${output-var} ${client} PARENT_SCOPE)
endfunction() 

# The reference pages on learn.flucoma.org are named after the process, not the
# client class: one page documents both the real-time and the buffer version of
# a process, so BufMFCC is documented at /reference/mfcc/. The processes below
# have no real-time counterpart to share a page with, so theirs keep the buf
# prefix (/reference/bufstats/, not /reference/stats/ — which is a different,
# real-time-only process).
set(FLUID_DOCS_KEEP_BUF_PREFIX BufNMF BufNMFCross BufNMFSeed BufStats BufSTFT)

function(make_doc_slug client output-var)
  if("${client}" IN_LIST FLUID_DOCS_KEEP_BUF_PREFIX)
    set(slug ${client})
  else()
    string(REGEX REPLACE "^Buf" "" slug ${client})
  endif()
  string(TOLOWER ${slug} slug)
  set(${output-var} ${slug} PARENT_SCOPE)
endfunction()

function (add_cli_binary name source doc_slug)
  
  add_executable(${name} ${source})

  # Lets -help print a link to this tool's own reference page rather than a
  # vague pointer at "the documentation". See docsURL() in FluidCLIWrapper.hpp.
  target_compile_definitions(${name} PRIVATE FLUID_CLI_DOC_SLUG="${doc_slug}")

  # if(MSVC)
  #   foreach(flag_var
  #       CMAKE_CXX_FLAGS CMAKE_CXX_FLAGS_DEBUG CMAKE_CXX_FLAGS_RELEASE
  #       CMAKE_CXX_FLAGS_MINSIZEREL CMAKE_CXX_FLAGS_RELWITHDEBINFO)
  #     if(${flag_var} MATCHES "/MD")
  #       string(REGEX REPLACE "/MD" "/MT" ${flag_var} "${${flag_var}}")
  #     endif()
  #   endforeach()
  # endif()

  target_link_libraries(${name}
    PRIVATE
    FLUID_DECOMPOSITION
    FLUID_CLI_WRAPPER
  )

  target_include_directories(
    ${name}
    PRIVATE 
    "${FLUID_VERSION_PATH}"
  )

  if (APPLE)
    #targeting <= 10.9, need to explicitly set libc++
    target_compile_options(${name} PRIVATE -stdlib=libc++)
    target_link_libraries(${name} PRIVATE -stdlib=libc++)
  endif()

  if(MSVC)
    target_compile_options(${name} PRIVATE  -D_USE_MATH_DEFINES /external:W0 /W3 /bigobj)
  else()
    target_compile_options(${name} PRIVATE -Wall -Wextra -Wpedantic -Wreturn-type -Wno-conversion)
  endif(MSVC)

  set_target_properties(
    ${name}
    PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${FLUCOMA_CLI_RUNTIME_OUTPUT_DIRECTORY}
    RUNTIME_OUTPUT_DIRECTORY_RELEASE ${FLUCOMA_CLI_RUNTIME_OUTPUT_DIRECTORY}
    RUNTIME_OUTPUT_DIRECTORY_DEBUG ${FLUCOMA_CLI_RUNTIME_OUTPUT_DIRECTORY}
    MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>"
  )

  get_property(HEADERS TARGET FLUID_DECOMPOSITION PROPERTY INTERFACE_SOURCES)
  source_group(TREE "${flucoma-core_SOURCE_DIR}/include" FILES ${HEADERS})
  
endfunction()

function(generate_cli_source)  
  # # Define the supported set of keywords
  set(noValues "")
  set(singleValues FILENAME EXTERNALS_OUT FILE_OUT)
  set(multiValues CLIENTS HEADERS CLASSES)
  # # Process the arguments passed in
  include(CMakeParseArguments)
  cmake_parse_arguments(ARG
  "${noValues}"
  "${singleValues}"
  "${multiValues}"
  ${ARGN})  
  
  list(GET ARG_CLIENTS 0 client_name)
  list(GET ARG_HEADERS 0 header)
  make_doc_slug(${client_name} doc_slug)

  if(ARG_FILENAME)
    set(external_name ${ARG_FILENAME})
  else()
    make_external_name(${client_name} ${header} external_name)
  endif()
    
  set(ENTRY_POINT "int main(int argc, const char* argv[])")
  set(WRAPPER_TEMPLATE [=[CLIWrapper<${class}>::run(argc, argv);]=])
  set(CCE_WRAPPER "#include \"FluidCLIWrapper.hpp\"")
  
  generate_source(${ARGN} EXTERNALS_OUT external FILE_OUT outfile)
  
  message(STATUS "Generating: ${external_name}")
  add_cli_binary(${external_name} ${outfile} ${doc_slug})
endfunction()
